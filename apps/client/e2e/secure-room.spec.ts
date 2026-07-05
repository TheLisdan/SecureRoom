import { readFileSync } from "node:fs";

import { expect, type Page, test } from "@playwright/test";

const email = `jane.${Date.now()}@acme.test`;
const notesTextBase64 = readFileSync(
  new URL("./fixtures/notes.txt", import.meta.url),
).toString("base64");
const markdownTextBase64 = readFileSync(
  new URL("./fixtures/deal-notes.md", import.meta.url),
).toString("base64");
const longImageName =
  "очень длинное название фотографии которое не должно уезжать вниз.png";

test("manages a secure dataroom end to end", async ({ page }) => {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get(
            "http://localhost:3000/auth/me",
          );
          return response.status();
        } catch {
          return 0;
        }
      },
      { timeout: 15_000 },
    )
    .toBe(401);

  await page.goto("/");

  await page.getByRole("button", { name: /need an account/i }).click();
  await page.getByLabel("Name").fill("Jane Davis");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct horse battery staple");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(
    page.getByRole("heading", { name: /create your first dataroom/i }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /^create dataroom$/i })
    .last()
    .click();
  await page
    .getByRole("dialog", { name: "Create dataroom" })
    .getByLabel("Name")
    .fill("Acme Acquisition");
  await page
    .getByRole("dialog", { name: "Create dataroom" })
    .getByRole("button", { name: "Save" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acme Acquisition" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /open dataroom actions/i }).click();
  await page.getByText("Rename dataroom").click();
  await page
    .getByRole("dialog", { name: "Rename dataroom" })
    .getByLabel("Name")
    .fill("Acme Acquisition 2026");
  await page
    .getByRole("dialog", { name: "Rename dataroom" })
    .getByRole("button", { name: "Save" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Acme Acquisition 2026" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /new folder/i }).click();
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByLabel("Name")
    .fill("Financials");
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByRole("button", { name: "Save" })
    .click();

  await page.getByRole("button", { name: /new folder/i }).click();
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByLabel("Name")
    .fill("Financials");
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByRole("button", { name: "Save" })
    .click();
  await expect(
    page.getByText("A folder with this name already exists here."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByText("Financials").dblclick();
  await page.getByRole("button", { name: /new folder/i }).click();
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByLabel("Name")
    .fill("Q1");
  await page
    .getByRole("dialog", { name: "Create folder" })
    .getByRole("button", { name: "Save" })
    .click();
  await page.getByText("Q1").dblclick();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page
    .locator("label")
    .filter({ hasText: /^Upload files$/ })
    .click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("e2e/fixtures/sample.pdf");

  await expect(page.getByText("sample.pdf")).toBeVisible();

  await dropFile(page, {
    base64: notesTextBase64,
    fileName: "notes.txt",
    mimeType: "text/plain",
  });
  await expect(page.getByText("notes.txt")).toBeVisible();

  await dropFile(page, {
    base64: markdownTextBase64,
    fileName: "deal-notes.md",
    mimeType: "application/octet-stream",
  });
  await expect(page.getByText("deal-notes.md")).toBeVisible();

  await dropFile(page, {
    base64: notesTextBase64,
    fileName: "договор.md",
    mimeType: "application/octet-stream",
  });
  await expect(page.getByText("договор.md")).toBeVisible();

  await dropGeneratedPng(page, longImageName);
  await expect(page.getByRole("button", { name: longImageName })).toBeVisible();

  await page.getByPlaceholder("Search files and folders").fill("sample");
  await expect(page.getByText("sample.pdf")).toBeVisible();

  await page.getByText("sample.pdf").click();
  await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download" })).toBeVisible();

  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "sample.pdf" })).toBeVisible();
  const previewFrame = page.locator('iframe[title="sample.pdf preview"]');
  await expect(previewFrame).toBeVisible();
  await expect(previewFrame).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByPlaceholder("Search files and folders").clear();

  await page.getByRole("button", { name: "Move" }).click();
  const moveDialog = page.getByRole("dialog", { name: "Move file" });
  await moveDialog.getByRole("button", { name: /^Financials$/ }).click();
  await moveDialog.getByRole("button", { name: "Move" }).click();
  await expect(page.getByRole("button", { name: "sample.pdf" })).toHaveCount(0);
  await page.getByRole("button", { name: "Financials" }).click();
  await expect(page.getByRole("button", { name: "sample.pdf" })).toBeVisible();
  await page.getByRole("button", { name: "Q1" }).dblclick();

  await page.getByText("notes.txt").click();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "notes.txt" })).toBeVisible();
  await expect(page.getByText("Revenue notes")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByText("deal-notes.md").click();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(
    page.getByRole("heading", { name: "deal-notes.md" }),
  ).toBeVisible();
  await expect(page.getByText("# Deal notes")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "договор.md" }).click();
  await expect(page.getByRole("heading", { name: "договор.md" })).toBeVisible();

  await page.getByRole("button", { name: longImageName }).click();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(
    page.getByRole("heading", { name: longImageName }),
  ).toBeVisible();
  const imagePreview = page.getByRole("img", { name: longImageName });
  await expect(imagePreview).toBeVisible();
  await expectPreviewInsideDialog(page, imagePreview);
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /open dataroom actions/i }).click();
  await page.getByText("Delete dataroom").click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: /create your first dataroom/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

async function dropFile(
  page: Page,
  file: { base64: string; fileName: string; mimeType: string },
) {
  const dataTransfer = await page.evaluateHandle(
    ({ base64, fileName, mimeType }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);

      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const file = new File([bytes], fileName, { type: mimeType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      return dataTransfer;
    },
    file,
  );
  const dropTarget = page.getByTestId("dataroom-drop-target");

  await dropTarget.dispatchEvent("dragenter", { dataTransfer });
  await expect(page.getByText("Drop files to upload")).toBeVisible();
  await dropTarget.dispatchEvent("dragover", { dataTransfer });
  await dropTarget.dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
}

async function dropGeneratedPng(page: Page, fileName: string) {
  const dataTransfer = await page.evaluateHandle(async (name) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;

    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#2563eb";
      context.fillRect(0, 0, canvas.width, 96);
      context.fillStyle = "#111827";
      context.font = "48px sans-serif";
      context.fillText("SecureRoom image preview", 72, 220);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }

        reject(new Error("Could not create PNG fixture."));
      }, "image/png");
    });
    const file = new File([blob], name, { type: "image/png" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    return dataTransfer;
  }, fileName);
  const dropTarget = page.getByTestId("dataroom-drop-target");

  await dropTarget.dispatchEvent("dragenter", { dataTransfer });
  await expect(page.getByText("Drop files to upload")).toBeVisible();
  await dropTarget.dispatchEvent("dragover", { dataTransfer });
  await dropTarget.dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
}

async function expectPreviewInsideDialog(
  page: Page,
  preview: ReturnType<Page["getByRole"]>,
) {
  const dialogBox = await page.getByRole("dialog").boundingBox();
  const previewBox = await preview.boundingBox();

  expect(dialogBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(previewBox!.y).toBeGreaterThanOrEqual(dialogBox!.y);
  expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(
    dialogBox!.y + dialogBox!.height + 1,
  );
}
