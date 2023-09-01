import block from "./block/index.js";
import property from "./property/index.js";

export {
  Serializer as BlockSerializer,
  Serializers as BlockSerializers,
} from "./block/types.js";

export {
  Serializer as PropertySerializer,
  Serializers as PropertySerializers,
} from "./property/types.js";

export const serializer = { block, property };
