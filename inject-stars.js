/** @type {import('fs')} */
const fs = require('fs');
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

// 3. Inject Star Button next to Trash2 buttons
const injectButton = (content, table) => {
    return content.replace(/<Button\s+variant="ghost"\s+size="icon"\s+className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-100"(?:[^>]*?)onClick=\{\(e\) => \{\s+e\.stopPropagation\(\);\s+safeMutation\(removeTheme, \{ id: (.+?)\._id \}, .+\);\s+\}\}\s+>\s*<Trash2 [^>]+>\s*<\/Button>/g, (match, itemVar) => {
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

txt = injectButton(txt, 'globalThemes');
fs.writeFileSync(path, txt);
