import { NotionProperties } from "../../notion.types.js";
import { defaults } from "./defaults.js";
import { strategy } from "./strategy.js";
import { Serializers } from "./types.js";

export default { defaults, strategy };

export const propertiesSerializer =
  (serializers: Serializers) => (props: NotionProperties) =>
    Promise.all(
      Object.entries(props).map(([key, prop]) =>
        serializers[prop.type](key, prop as any),
      ),
    ).then((texts) => texts.filter((text): text is string => text !== false));
