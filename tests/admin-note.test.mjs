import test from "node:test";
import assert from "node:assert/strict";
import { adminNoteError, bookingNotePayload } from "../src/lib/booking/admin-note.ts";

test("admin cannot submit an empty or whitespace-only note", () => {
  for (const note of ["", "  ", "\n\t"]) {
    assert.ok(adminNoteError(note));
    assert.throws(() => bookingNotePayload("admin", note));
  }
});
test("note respects the backend 1000-character limit", () => {
  assert.equal(adminNoteError("a".repeat(1000)), null);
  assert.ok(adminNoteError("a".repeat(1001)));
});
test("admin sends only note, preserving internal newlines", () => {
  assert.deepEqual(bookingNotePayload("admin", " Mario Rossi\nTaglio corto "), { note: "Mario Rossi\nTaglio corto" });
});
test("normal users never send a note or user_id", () => {
  for (const role of [undefined, "client", "staff", "Admin"]) {
    assert.deepEqual(bookingNotePayload(role, "Mario Rossi"), {});
    assert.deepEqual(bookingNotePayload(role, ""), {});
  }
});
