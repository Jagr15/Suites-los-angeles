export * from "../../schemas/asset-schema";

import { AssetSchema } from "../../schemas/asset-schema";

export interface Asset extends AssetSchema {
  _id: string;
}
