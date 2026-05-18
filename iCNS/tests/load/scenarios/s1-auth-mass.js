// k6 scenario S1 — Authentification massive (Prompt 6.1)
// Exécution : k6 run s1-auth-mass.js
// Pré-requis : ICNS_CONVEX_URL pointant sur l'instance de test.
//
// Objectif : 500 utilisateurs s'authentifient en 60 s, mesurer p95 < 1,5 s.

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    rampe: {
      executor: "ramping-arrival-rate",
      startRate: 0,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 500,
      stages: [
        { target: 8, duration: "60s" }, // 8 auths/s pendant 60s
        { target: 8, duration: "60s" }, // soutenir
        { target: 0, duration: "30s" }, // ramp-down
      ],
    },
  },
  thresholds: {
    "http_req_duration{operation:authenticate}": ["p(95)<1500"],
    http_req_failed: ["rate<0.001"],
  },
};

const ICNS_URL = __ENV.ICNS_CONVEX_URL || "https://icns-dev.convex.cloud";

export default function () {
  // Étape 1 : challenge
  const challengeRes = http.post(
    `${ICNS_URL}/api/query`,
    JSON.stringify({
      path: "auth/authenticate:issueChallenge",
      args: {},
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "issueChallenge" },
    },
  );
  check(challengeRes, { "challenge ok": (r) => r.status === 200 });

  const challenge = challengeRes.json("challenge");

  // Étape 2 : authenticate (mock cert + sign)
  const matricule = `LOAD-${__VU.toString().padStart(3, "0")}`;
  const authRes = http.post(
    `${ICNS_URL}/api/mutation`,
    JSON.stringify({
      path: "auth/authenticate:authenticate",
      args: {
        certificat: {
          matricule,
          serialNumber: `SN-LOAD-${__VU}`,
          issuer: "CN=PKI_SOUVERAINE_DEV",
          notBefore: Date.now() - 86400000,
          notAfter: Date.now() + 86400000,
        },
        challenge,
        challengeSigne: `MOCK-SIGN:${challenge}`,
        adresseIP: "10.0.99.99",
        poste: "LOAD-TEST",
      },
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { operation: "authenticate" },
    },
  );
  check(authRes, { "auth ok": (r) => r.status === 200 });

  sleep(1);
}
