import fs from 'fs';
const path = 'C:/Users/Evelyn/Documents/makemoments/src/pages/admin/FilesPage.tsx';
let txt = fs.readFileSync(path, 'utf8');

// 1. Add Star import
if (!txt.includes('Star,')) {
    txt = txt.replace('import { Plus, Trash2, Edit, Music as MusicIcon, Sparkles, Type, Upload, Loader2, User, X, Image as ImageIcon, DollarSign, Play } from "lucide-react";', 'import { Plus, Trash2, Edit, Music as MusicIcon, Sparkles, Type, Upload, Loader2, User, X, Image as ImageIcon, DollarSign, Play, Star } from "lucide-react";');
}

// 2. Add mutation
if (!txt.includes('const setDefaultAsset = useMutation(api.assets.setDefaultAsset);')) {
    txt = txt.replace('const createTheme = useMutation(api.themes.create);', 'const setDefaultAsset = useMutation(api.assets.setDefaultAsset);\n    const createTheme = useMutation(api.themes.create);');
}

// 3. Inject Star Button for Desktop grids (Themes, Fonts, Characters)
const injectGridButton = (content, removeName, itemVar, table) => {
    const regex = new RegExp(`<Button\\s+variant="ghost"\\s+size="icon"\\s+className="[^"]*"\\s+onClick=\\{\\(e\\) => \\{\\s+e\\.stopPropagation\\(\\);\\s+safeMutation\\(${removeName}, \\{ id: ${itemVar}\\._id \\}, .+\\);\\s+\\}\\}\\s+>\\s*<Trash2 [^>]+>\\s*<\\/Button>`, 'g');

    return content.replace(regex, (match) => {
        return `
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8 rounded-full border transition-colors", ${itemVar}.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white hover:bg-zinc-100 border-zinc-200")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(setDefaultAsset, { id: ${itemVar}._id, table: "${table}" }, "Default updated");
                                                            }}
                                                        >
                                                            <Star className={cn("h-4 w-4", ${itemVar}.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                        </Button>
` + match;
    });
};

txt = injectGridButton(txt, 'removeTheme', 'theme', 'globalThemes');
txt = injectGridButton(txt, 'removeCharacter', 'char', 'globalCharacters');

// 4. Inject Star Button for Fonts (Mobile)
const injectFontMobile = (content) => {
    return content.replace(/<div className="flex gap-1">\s*<Button\s+variant="ghost"\s+size="icon"\s+className="h-8 w-8 text-red-500"\s+onClick=\\{\(e\) => \\{\s+e\.stopPropagation\(\\);\s+safeMutation\(removeFont,\s+\\{ id: font._id \\},\s+"Font removed"\);\s+\\}\\}\s+>\s+<Trash2 className="h-4 w-4" \/>\s+<\/Button>\s*<\/div>/g,
        `<div className="flex gap-1">
                                                        <Button
                                                            variant="ghost" size="icon" className={cn("h-8 w-8 border transition-colors", font.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white hover:bg-zinc-100 border-zinc-200")}
                                                            onClick={(e) => { e.stopPropagation(); safeMutation(setDefaultAsset, { id: font._id, table: "globalFonts" }, "Default font updated"); }}
                                                        >
                                                            <Star className={cn("h-4 w-4", font.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-8 w-8 text-red-500"
                                                            onClick={(e) => { e.stopPropagation(); safeMutation(removeFont, { id: font._id }, "Font removed"); }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>`
    );
};
txt = injectFontMobile(txt);

fs.writeFileSync(path, txt);
console.log('Script completed');
