import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAutopayHash,
  createAutopayItnConfirmation,
  createAutopayPaymentForm,
  parseAutopayItn,
  verifyAutopayItn,
  verifyAutopayReturn,
  type AutopayConfig,
} from "./autopay";

const config: AutopayConfig = {
  serviceId: "2",
  sharedKey: "2test2",
  hashAlgorithm: "sha256",
  gatewayUrl: "https://testpay.autopay.eu",
  sandbox: true,
};

test("oblicza hash startu transakcji zgodny z przykładem Autopay", () => {
  assert.equal(
    calculateAutopayHash(["2", "100", "1.50"], "2test2"),
    "2ab52e6918c6ad3b69a8228a2ab815f11ad58533eeed963dd990df8d8c3709d1"
  );
});

test("buduje podpisany formularz paywallu w wymaganej kolejności", () => {
  const payment = createAutopayPaymentForm(
    {
      orderNumber: "CR-260811-ABC123",
      totalPln: 149.9,
      customerEmail: "klient@example.com",
    },
    config
  );

  assert.equal(payment.action, "https://testpay.autopay.eu");
  assert.deepEqual(
    { ...payment.fields, Hash: undefined },
    {
      ServiceID: "2",
      OrderID: "CR-260811-ABC123",
      Amount: "149.90",
      Description: "Zamowienie CR-260811-ABC123",
      GatewayID: "0",
      Currency: "PLN",
      CustomerEmail: "klient@example.com",
      Hash: undefined,
    }
  );
  assert.equal(
    payment.fields.Hash,
    calculateAutopayHash(
      ["2", "CR-260811-ABC123", "149.90", "Zamowienie CR-260811-ABC123", "0", "PLN", "klient@example.com"],
      config.sharedKey
    )
  );
});

test("weryfikuje podpis powrotu klienta", () => {
  const orderId = "CR-260811-ABC123";
  const hash = calculateAutopayHash([config.serviceId, orderId], config.sharedKey);

  assert.equal(verifyAutopayReturn({ serviceId: "2", orderId, hash }, config), true);
  assert.equal(verifyAutopayReturn({ serviceId: "2", orderId, hash: `${hash}00` }, config), false);
});

test("parsuje i weryfikuje ITN oraz tworzy podpisane potwierdzenie", () => {
  const values = [
    "2",
    "CR-260811-ABC123",
    "REMOTE-123",
    "149.90",
    "PLN",
    "1500",
    "20260811123045",
    "SUCCESS",
    "AUTH_OK",
  ];
  const hash = calculateAutopayHash(values, config.sharedKey);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><transactionList><serviceID>2</serviceID><transactions><transaction><orderID>CR-260811-ABC123</orderID><remoteID>REMOTE-123</remoteID><amount>149.90</amount><currency>PLN</currency><gatewayID>1500</gatewayID><paymentDate>20260811123045</paymentDate><paymentStatus>SUCCESS</paymentStatus><paymentStatusDetails>AUTH_OK</paymentStatusDetails></transaction></transactions><hash>${hash}</hash></transactionList>`;

  const notification = parseAutopayItn(Buffer.from(xml, "utf8").toString("base64"));
  assert.equal(notification.remoteId, "REMOTE-123");
  assert.equal(notification.paymentStatus, "SUCCESS");
  assert.equal(verifyAutopayItn(notification, config), true);

  const confirmation = createAutopayItnConfirmation(notification, "CONFIRMED", config);
  assert.match(confirmation, /<confirmation>CONFIRMED<\/confirmation>/);
  assert.match(
    confirmation,
    new RegExp(
      `<hash>${calculateAutopayHash(["2", "CR-260811-ABC123", "CONFIRMED"], config.sharedKey)}</hash>`
    )
  );
});

test("odrzuca XML z deklaracją DTD", () => {
  const xml = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY y "test">]><transactionList></transactionList>`;
  assert.throws(
    () => parseAutopayItn(Buffer.from(xml, "utf8").toString("base64")),
    /struktura XML/
  );
});
