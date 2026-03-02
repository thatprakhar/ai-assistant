import fs from "fs/promises";
import path from "path";

async function walk(dir) {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await walk(filePath));
        } else if (filePath.endsWith(".ts")) {
            results.push(filePath);
        }
    }
    return results;
}

async function fixImports() {
    const srcDir = path.join(process.cwd(), "src");
    const files = await walk(srcDir);
    for (const file of files) {
        let content = await fs.readFile(file, "utf8");
        // Match standard relative imports `import ... from "./foo"` or `export ... from "../bar"`
        // which do NOT end with .ts, .js, .json
        const importRegex = /(import|export)\s+(?:[^"']+)\s+from\s+["'](\.\.?[^"']+)["']/g;
        const dynamicRegex = /import\s*\(\s*["'](\.\.?[^"']+)["']\s*\)/g;

        let modified = false;

        content = content.replace(importRegex, (match, type, importPath) => {
            if (!importPath.endsWith(".js") && !importPath.endsWith(".ts") && !importPath.endsWith(".json")) {
                modified = true;
                return match.replace(importPath, importPath + ".js");
            }
            return match;
        });

        content = content.replace(dynamicRegex, (match, importPath) => {
            if (!importPath.endsWith(".js") && !importPath.endsWith(".ts") && !importPath.endsWith(".json")) {
                modified = true;
                return match.replace(importPath, importPath + ".js");
            }
            return match;
        });

        // Handle bare imports without alias "import './foo'"
        const sideEffectRegex = /import\s+["'](\.\.?[^"']+)["']/g;
        content = content.replace(sideEffectRegex, (match, importPath) => {
            if (!importPath.endsWith(".js") && !importPath.endsWith(".ts") && !importPath.endsWith(".json")) {
                modified = true;
                return match.replace(importPath, importPath + ".js");
            }
            return match;
        });

        if (modified) {
            await fs.writeFile(file, content, "utf8");
            console.log(`Updated imports in ${file}`);
        }
    }
}

fixImports().catch(console.error);
