/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_presidentielle_handlers from "../api_presidentielle/handlers.js";
import type * as audit from "../audit.js";
import type * as audit_verify from "../audit_verify.js";
import type * as auth_authenticate from "../auth/authenticate.js";
import type * as auth_jwt from "../auth/jwt.js";
import type * as auth_middleware from "../auth/middleware.js";
import type * as cns_crossing from "../cns/crossing.js";
import type * as cns_synthesis from "../cns/synthesis.js";
import type * as crise_activation from "../crise/activation.js";
import type * as crons from "../crons.js";
import type * as crypto_dek_manager from "../crypto/dek_manager.js";
import type * as crypto_service from "../crypto/service.js";
import type * as dashboard from "../dashboard.js";
import type * as dgss from "../dgss.js";
import type * as dossiers_create from "../dossiers/create.js";
import type * as dossiers_queries from "../dossiers/queries.js";
import type * as dossiers_return from "../dossiers/return.js";
import type * as dossiers_sign from "../dossiers/sign.js";
import type * as dossiers_state_machine from "../dossiers/state_machine.js";
import type * as dossiers_transmit from "../dossiers/transmit.js";
import type * as http from "../http.js";
import type * as iarchive_declassification from "../iarchive/declassification.js";
import type * as iarchive_retention from "../iarchive/retention.js";
import type * as icom_create from "../icom/create.js";
import type * as icom_escalate from "../icom/escalate.js";
import type * as icom_queries from "../icom/queries.js";
import type * as idocument_download from "../idocument/download.js";
import type * as idocument_integrity from "../idocument/integrity.js";
import type * as idocument_upload from "../idocument/upload.js";
import type * as operations from "../operations.js";
import type * as secretariat from "../secretariat.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as validators_classification from "../validators/classification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "api_presidentielle/handlers": typeof api_presidentielle_handlers;
  audit: typeof audit;
  audit_verify: typeof audit_verify;
  "auth/authenticate": typeof auth_authenticate;
  "auth/jwt": typeof auth_jwt;
  "auth/middleware": typeof auth_middleware;
  "cns/crossing": typeof cns_crossing;
  "cns/synthesis": typeof cns_synthesis;
  "crise/activation": typeof crise_activation;
  crons: typeof crons;
  "crypto/dek_manager": typeof crypto_dek_manager;
  "crypto/service": typeof crypto_service;
  dashboard: typeof dashboard;
  dgss: typeof dgss;
  "dossiers/create": typeof dossiers_create;
  "dossiers/queries": typeof dossiers_queries;
  "dossiers/return": typeof dossiers_return;
  "dossiers/sign": typeof dossiers_sign;
  "dossiers/state_machine": typeof dossiers_state_machine;
  "dossiers/transmit": typeof dossiers_transmit;
  http: typeof http;
  "iarchive/declassification": typeof iarchive_declassification;
  "iarchive/retention": typeof iarchive_retention;
  "icom/create": typeof icom_create;
  "icom/escalate": typeof icom_escalate;
  "icom/queries": typeof icom_queries;
  "idocument/download": typeof idocument_download;
  "idocument/integrity": typeof idocument_integrity;
  "idocument/upload": typeof idocument_upload;
  operations: typeof operations;
  secretariat: typeof secretariat;
  seed: typeof seed;
  users: typeof users;
  "validators/classification": typeof validators_classification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
