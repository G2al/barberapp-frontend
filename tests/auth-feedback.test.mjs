import test from "node:test";
import assert from "node:assert/strict";
import { authErrorFeedback, readableAuthMessage, PASSWORD_MIN_LENGTH } from "../src/lib/auth/form-feedback.ts";

test("password policy matches the local backend", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 6);
});
test("email and phone uniqueness errors are field-specific", () => {
  const result = authErrorFeedback(422, { errors: { email: ["validation.unique"], phone: "validation.unique" } }, "register");
  assert.match(result.fields.email, /Email già in uso/);
  assert.match(result.fields.phone, /telefono è già registrato/);
  assert.match(readableAuthMessage("The email has already been taken.", "email"), /Email già in uso/);
});
test("required, email, minimum and confirmation keys are translated", () => {
  for (const [key, field, expected] of [
    ["required", "name", /Inserisci nome/], ["email", "email", /email valido/],
    ["min.string", "password", /6 caratteri/], ["confirmed", "password", /non coincidono/],
  ]) assert.match(readableAuthMessage(`validation.${key}`, field), expected);
});
test("malformed, missing and invisible field errors still have a visible message", () => {
  for (const payload of [null, {}, { errors: [] }, { errors: { token: ["validation.required"] } }, { errors: { email: [] } }]) {
    const result = authErrorFeedback(422, payload, "reset");
    assert.ok(result.message);
    assert.deepEqual(result.fields, {});
  }
});
test("technical errors are not exposed, readable backend messages are retained", () => {
  for (const message of ["validation.unknown", "SQLSTATE failure", "RuntimeException", "<html>Error</html>"]) {
    assert.equal(readableAuthMessage(message), "Controlla i dati inseriti e riprova.");
  }
  assert.equal(readableAuthMessage("Link non valido o scaduto."), "Link non valido o scaduto.");
});
test("auth and transport errors get actionable messages", () => {
  for (const [status, expected] of [[0, /connessione/], [401, /Email o password/], [403, /disattivato/], [419, /scaduta/], [429, /Attendi/], [500, /temporaneamente/], [503, /temporaneamente/]]) {
    assert.match(authErrorFeedback(status, { message: "SQLSTATE failure" }, "login").message, expected);
  }
});
test("login does not expose whether a particular email exists", () => {
  assert.deepEqual(authErrorFeedback(401, { message: "User not found" }, "login"), authErrorFeedback(401, { message: "Password wrong" }, "login"));
});
