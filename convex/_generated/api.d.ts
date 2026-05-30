/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets_mutations from "../assets/mutations.js";
import type * as assets_queries from "../assets/queries.js";
import type * as audit_queries from "../audit/queries.js";
import type * as auth from "../auth.js";
import type * as bodega_transactions_mutations from "../bodega_transactions/mutations.js";
import type * as bodega_transactions_queries from "../bodega_transactions/queries.js";
import type * as bodegas_mutations from "../bodegas/mutations.js";
import type * as bodegas_queries from "../bodegas/queries.js";
import type * as clients_mutations from "../clients/mutations.js";
import type * as clients_queries from "../clients/queries.js";
import type * as common_hashing from "../common/hashing.js";
import type * as common_mutations from "../common/mutations.js";
import type * as common_utils from "../common/utils.js";
import type * as common_warehouseFolios from "../common/warehouseFolios.js";
import type * as credits_functions from "../credits/functions.js";
import type * as debug from "../debug.js";
import type * as demoSeed from "../demoSeed.js";
import type * as finance_accounts_functions from "../finance_accounts/functions.js";
import type * as fixedAssetTypes from "../fixedAssetTypes.js";
import type * as http from "../http.js";
import type * as inventory_mutations from "../inventory/mutations.js";
import type * as inventory_queries from "../inventory/queries.js";
import type * as inventoryLogs_queries from "../inventoryLogs/queries.js";
import type * as loans_functions from "../loans/functions.js";
import type * as maintenance from "../maintenance.js";
import type * as product_categories_functions from "../product_categories/functions.js";
import type * as products_mutations from "../products/mutations.js";
import type * as products_queries from "../products/queries.js";
import type * as profiles_mutations from "../profiles/mutations.js";
import type * as profiles_queries from "../profiles/queries.js";
import type * as purchase_budgets_queries from "../purchase_budgets/queries.js";
import type * as purchases_mutations from "../purchases/mutations.js";
import type * as purchases_queries from "../purchases/queries.js";
import type * as roles_mutations from "../roles/mutations.js";
import type * as roles_queries from "../roles/queries.js";
import type * as routes_mutations from "../routes/mutations.js";
import type * as routes_queries from "../routes/queries.js";
import type * as salidas_mutations from "../salidas/mutations.js";
import type * as salidas_queries from "../salidas/queries.js";
import type * as seed from "../seed.js";
import type * as staff_mutations from "../staff/mutations.js";
import type * as staff_queries from "../staff/queries.js";
import type * as supplierTransactions_mutations from "../supplierTransactions/mutations.js";
import type * as supplierTransactions_queries from "../supplierTransactions/queries.js";
import type * as suppliers_mutations from "../suppliers/mutations.js";
import type * as suppliers_queries from "../suppliers/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as vehicles_mutations from "../vehicles/mutations.js";
import type * as vehicles_queries from "../vehicles/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "assets/mutations": typeof assets_mutations;
  "assets/queries": typeof assets_queries;
  "audit/queries": typeof audit_queries;
  auth: typeof auth;
  "bodega_transactions/mutations": typeof bodega_transactions_mutations;
  "bodega_transactions/queries": typeof bodega_transactions_queries;
  "bodegas/mutations": typeof bodegas_mutations;
  "bodegas/queries": typeof bodegas_queries;
  "clients/mutations": typeof clients_mutations;
  "clients/queries": typeof clients_queries;
  "common/hashing": typeof common_hashing;
  "common/mutations": typeof common_mutations;
  "common/utils": typeof common_utils;
  "common/warehouseFolios": typeof common_warehouseFolios;
  "credits/functions": typeof credits_functions;
  debug: typeof debug;
  demoSeed: typeof demoSeed;
  "finance_accounts/functions": typeof finance_accounts_functions;
  fixedAssetTypes: typeof fixedAssetTypes;
  http: typeof http;
  "inventory/mutations": typeof inventory_mutations;
  "inventory/queries": typeof inventory_queries;
  "inventoryLogs/queries": typeof inventoryLogs_queries;
  "loans/functions": typeof loans_functions;
  maintenance: typeof maintenance;
  "product_categories/functions": typeof product_categories_functions;
  "products/mutations": typeof products_mutations;
  "products/queries": typeof products_queries;
  "profiles/mutations": typeof profiles_mutations;
  "profiles/queries": typeof profiles_queries;
  "purchase_budgets/queries": typeof purchase_budgets_queries;
  "purchases/mutations": typeof purchases_mutations;
  "purchases/queries": typeof purchases_queries;
  "roles/mutations": typeof roles_mutations;
  "roles/queries": typeof roles_queries;
  "routes/mutations": typeof routes_mutations;
  "routes/queries": typeof routes_queries;
  "salidas/mutations": typeof salidas_mutations;
  "salidas/queries": typeof salidas_queries;
  seed: typeof seed;
  "staff/mutations": typeof staff_mutations;
  "staff/queries": typeof staff_queries;
  "supplierTransactions/mutations": typeof supplierTransactions_mutations;
  "supplierTransactions/queries": typeof supplierTransactions_queries;
  "suppliers/mutations": typeof suppliers_mutations;
  "suppliers/queries": typeof suppliers_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "vehicles/mutations": typeof vehicles_mutations;
  "vehicles/queries": typeof vehicles_queries;
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
