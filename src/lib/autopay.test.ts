import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAutopayHash,
  createAutopayItnConfirmation,
  createAutopayPaymentForm,
  getAutopayConfig,
  parseAutopayItn,
  parseAutopayPaymentDate,
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
  const expiresAt = new Date("2030-08-18T10:00:00.000Z");
  const payment = createAutopayPaymentForm(
    {
      orderNumber: "CR-260811-ABC123",
      totalPln: 149.9,
      customerEmail: "klient@example.com",
      reservationExpiresAt: expiresAt,
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
      ValidityTime: payment.fields.ValidityTime,
      Hash: undefined,
    }
  );
  assert.equal(
    payment.fields.Hash,
    calculateAutopayHash(
      [
        "2",
        "CR-260811-ABC123",
        "149.90",
        "Zamowienie CR-260811-ABC123",
        "0",
        "PLN",
        "klient@example.com",
        payment.fields.ValidityTime,
      ],
      config.sharedKey
    )
  );
  assert.match(payment.fields.ValidityTime, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.equal(payment.fields.ValidityTime, "2030-08-18 11:00:00");
});

test("weryfikuje podpis powrotu klienta", () => {
  const orderId = "CR-260811-ABC123";
  const hash = calculateAutopayHash([config.serviceId, orderId], config.sharedKey);

  assert.equal(verifyAutopayReturn({ serviceId: "2", orderId, hash }, config), true);
  assert.equal(verifyAutopayReturn({ serviceId: "2", orderId, hash: `${hash}0` }, config), false);
  assert.equal(verifyAutopayReturn({ serviceId: "2", orderId, hash: `${hash}00` }, config), false);
});

test("blokuje konfigurację sandbox w produkcji", () => {
  const previous = {
    appEnv: process.env.APP_ENV,
    serviceId: process.env.AUTOPAY_SERVICE_ID,
    sharedKey: process.env.AUTOPAY_SHARED_KEY,
    sandbox: process.env.AUTOPAY_SANDBOX,
  };
  process.env.APP_ENV = "production";
  process.env.AUTOPAY_SERVICE_ID = "2";
  process.env.AUTOPAY_SHARED_KEY = "test-key";
  process.env.AUTOPAY_SANDBOX = "true";
  try {
    assert.throws(() => getAutopayConfig(), /zabronione/);
  } finally {
    if (previous.appEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = previous.appEnv;
    if (previous.serviceId === undefined) delete process.env.AUTOPAY_SERVICE_ID;
    else process.env.AUTOPAY_SERVICE_ID = previous.serviceId;
    if (previous.sharedKey === undefined) delete process.env.AUTOPAY_SHARED_KEY;
    else process.env.AUTOPAY_SHARED_KEY = previous.sharedKey;
    if (previous.sandbox === undefined) delete process.env.AUTOPAY_SANDBOX;
    else process.env.AUTOPAY_SANDBOX = previous.sandbox;
  }
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
  assert.equal(parseAutopayPaymentDate(notification.paymentDate).toISOString(), "2026-08-11T11:30:45.000Z");
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

test("odrzuca nieistniejącą datę ITN", () => {
  assert.throws(() => parseAutopayPaymentDate("20260230123045"), /data ITN/);
});

test("odrzuca XML z deklaracją DTD", () => {
  const xml = `<?xml version="1.0"?><!DOCTYPE x [<!ENTITY y "test">]><transactionList></transactionList>`;
  assert.throws(
    () => parseAutopayItn(Buffer.from(xml, "utf8").toString("base64")),
    /struktura XML/
  );
});
