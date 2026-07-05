import { describe, expect, it } from "vitest";

import { collectDescendantFolderIds } from "./folder-tree.js";

describe("collectDescendantFolderIds", () => {
  it("returns a folder and every nested descendant", () => {
    const ids = collectDescendantFolderIds(
      [
        { id: "legal", parentFolderId: null },
        { id: "contracts", parentFolderId: "legal" },
        { id: "signed", parentFolderId: "contracts" },
        { id: "financials", parentFolderId: null },
      ],
      "legal",
    );

    expect(ids).toEqual(["legal", "contracts", "signed"]);
  });
});
