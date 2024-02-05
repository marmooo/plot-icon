import { expandGlobSync } from "https://deno.land/std/fs/expand_glob.ts";

const dirs = [
  "material-symbols",
  "material-design-icons",
  "phosphor-icons",
  "tabler-icons",
  "bootstrap-icons",
  "RemixIcon",
  "iconoir",
  "majesticons",
  "lucide",
  "streamline-vectors",
];
const baseDir = Deno.realPathSync("svg");
for (const dir of dirs) {
  const paths = [];
  const glob = expandGlobSync(`${baseDir}/${dir}/**/*.svg`, { globstar: true });
  for (const file of glob) {
    const path = file.path.slice(baseDir.length + dir.length + 2);
    paths.push(path);
  }
  Deno.writeTextFileSync(`src/data/${dir}.txt`, paths.join("\n"));
}
