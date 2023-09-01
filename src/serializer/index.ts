import block from "./block/index.js";
import { Serializers as BlockSerializers } from "./block/types.js";
import property from "./property/index.js";
import { Serializers as PropertySerializers } from "./property/types.js";
import * as utils from "./utils.js";

export {
  Serializer as BlockSerializer,
  Serializers as BlockSerializers,
} from "./block/types.js";

export {
  Serializer as PropertySerializer,
  Serializers as PropertySerializers,
} from "./property/types.js";

export type Serializers = {
  block: BlockSerializers;
  property: PropertySerializers;
};

export const serializer = { block, property, utils };
